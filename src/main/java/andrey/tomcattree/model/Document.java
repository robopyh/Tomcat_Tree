package andrey.tomcattree.model;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Entity
public class Document {

    @Id
    @GeneratedValue
    private Long id;
    private Long parent;
    private String text;
    private boolean folder;

    public Document() {
    }

    public Document(Long parent, String text, boolean folder) {
        this.parent = parent;
        this.text = text;
        this.folder = folder;
    }

    public Long getId() {
        return id;
    }

    public Long getParent() {
        return parent;
    }

    public String getText() {
        return text;
    }

    public boolean isFolder() {
        return folder;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setParent(Long parent) {
        this.parent = parent;
    }

    public void setText(String text) {
        this.text = text;
    }

    public void setFolder(boolean folder) {
        this.folder = folder;
    }
}
