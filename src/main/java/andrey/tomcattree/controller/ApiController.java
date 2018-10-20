package andrey.tomcattree.controller;

import andrey.tomcattree.model.Document;
import andrey.tomcattree.repository.DocumentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/tree")
public class ApiController {

    private final DocumentRepository documentRepository;

    public ApiController(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    // get list of root folders
    @RequestMapping("/roots")
    public Iterable<Document> getRoots() {
        return documentRepository.findRoots();
    }

    // get list of folder children
    @RequestMapping("/item/{id}/children")
    public Iterable<Document> getChildrenById(@PathVariable("id") Long id) throws InterruptedException {
        // Requested load 2s delay
        Thread.sleep(2*1000);
        return documentRepository.findChildrenByParent(id);
    }

    // check if a folder has a child with given ID
    @RequestMapping("/item/{id}/has/{child_id}")
    public boolean hasChildById(@PathVariable("id") Long parent, @PathVariable("child_id") Long children) {
        // check children
        Iterable<Document> documents = documentRepository.findChildrenByParent(parent);
        for (Document document : documents) {
            if(hasChildById(document.getId(), children))
                return true;
            if(children.equals(document.getId()))
                return true;
        }
        return false;
    }

    // change an item parent ID
    @RequestMapping(method = RequestMethod.POST, value = "/item/changeParent")
    public void changeParentId(@RequestBody Map<String, String> IDs) {
        Optional<Document> itemDB = documentRepository.findById(Long.valueOf(IDs.get("itemId")));
        itemDB.ifPresent(document -> {
            document.setParent(Long.valueOf(IDs.get("newParentId")));
            documentRepository.save(document);
        });
    }

    // change an item text
    @RequestMapping(method = RequestMethod.POST, value = "/item/changeText")
    public void changeText(@RequestBody Map<String, String> values) {
        Optional<Document> itemDB = documentRepository.findById(Long.valueOf(values.get("itemId")));
        itemDB.ifPresent(document -> {
            document.setText(values.get("newText"));
            documentRepository.save(document);
        });
    }

    // delete an item
    @RequestMapping(method = RequestMethod.POST, value = "/item/delete/")
    public void deleteItem(@RequestBody Long id) {
        Iterable<Document> documents = documentRepository.findChildrenByParent(id);
        // delete all children
        for (Document document : documents) {
            deleteItem(document.getId());
        }
        documentRepository.deleteById(id);
    }

    // create a new item
    @RequestMapping(method = RequestMethod.POST, value = "/createItem")
    public Long createItem(@RequestBody Document document) {
        Document savedDocument = documentRepository.save(document);
        return savedDocument.getId();
    }
}
