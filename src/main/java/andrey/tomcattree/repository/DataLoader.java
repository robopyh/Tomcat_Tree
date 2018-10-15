package andrey.tomcattree.repository;

import andrey.tomcattree.model.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/*
fill db with test data
create and save 10 items
 */

@Component
public class DataLoader implements ApplicationRunner{

    private DocumentRepository documentRepository;

    public DataLoader (DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        // generated IDs starts with 1
        for (int i = 1; i <= 10; i++) {
            // random parent ID
            // if ID = 0, set it to null
            long random = (long) (Math.random() * i);
            Long parent = random == 0 ? null : random;

            // create and save new item
            Document document = new Document(parent, "folder " + i, true);
            documentRepository.save(document);
        }
    }
}
